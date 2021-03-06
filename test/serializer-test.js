import factory from './helpers/factory';
import testHelpers from './helpers/testHelpers';
import {default as Serializer, TypeResolver, deserialize} from '../index';

const lanesSource = factory.resource('lanes.bpmn');
const subProcessSource = factory.resource('sub-process.bpmn');
const twoProcessesSource = factory.resource('two-executable-processes.bpmn');
const eventDefinitionSource = factory.resource('bound-error-and-timer.bpmn');
const types = {
  Definition: () => {},
  Process: () => {},
  BoundaryEvent: () => {},
  BpmnError: () => {},
  DataObject: () => {},
  Dummy: () => {},
  EndEvent: () => {},
  ErrorEventDefinition: () => {},
  ExclusiveGateway: () => {},
  InclusiveGateway: () => {},
  IntermediateCatchEvent: () => {},
  IoSpecification: () => {},
  MessageEventDefinition: () => {},
  MessageFlow: () => {},
  MultiInstanceLoopCharacteristics: () => {},
  ParallelGateway: () => {},
  ScriptTask: () => {},
  SequenceFlow: () => {},
  ServiceImplementation: () => {},
  ServiceTask: () => {},
  SignalTask: () => {},
  StartEvent: () => {},
  SubProcess: () => {},
  Task: () => {},
  TerminateEventDefinition: () => {},
  TimerEventDefinition: () => {},
};

const typeResolver = TypeResolver(types);

describe('moddle context serializer', () => {
  let lanesModdleContext, subProcessModdleContext, eventDefinitionModdleContext, twoProcessesModdleContext;
  before(async () => {
    lanesModdleContext = await testHelpers.moddleContext(lanesSource);
    subProcessModdleContext = await testHelpers.moddleContext(subProcessSource);
    eventDefinitionModdleContext = await testHelpers.moddleContext(eventDefinitionSource);
    twoProcessesModdleContext = await testHelpers.moddleContext(twoProcessesSource);
  });

  describe('default', () => {
    let serializer;
    before(() => {
      serializer = Serializer(lanesModdleContext, typeResolver);
    });

    it('holds definition id, type, and name', async () => {
      expect(serializer).to.have.property('id', 'Definitions_1');
      expect(serializer).to.have.property('type', 'bpmn:Definitions');
      expect(serializer).to.have.property('name', 'Lanes');
    });

    it('has the expected api', async () => {
      expect(serializer).to.have.property('getActivities').that.is.a('function');
      expect(serializer).to.have.property('getActivities').that.is.a('function');
      expect(serializer).to.have.property('getActivityById').that.is.a('function');
      expect(serializer).to.have.property('getDataObjects').that.is.a('function');
      expect(serializer).to.have.property('getErrorById').that.is.a('function');
      expect(serializer).to.have.property('getInboundSequenceFlows').that.is.a('function');
      expect(serializer).to.have.property('getMessageFlows').that.is.a('function');
      expect(serializer).to.have.property('getOutboundSequenceFlows').that.is.a('function');
      expect(serializer).to.have.property('getProcessById').that.is.a('function');
      expect(serializer).to.have.property('getProcesses').that.is.a('function');
      expect(serializer).to.have.property('getExecutableProcesses').that.is.a('function');
      expect(serializer).to.have.property('getSequenceFlowById').that.is.a('function');
      expect(serializer).to.have.property('getSequenceFlows').that.is.a('function');
      expect(serializer).to.have.property('serialize').that.is.a('function');
    });
  });

  describe('getProcesses()', () => {
    it('returns processes', async () => {
      const serializer = Serializer(lanesModdleContext, typeResolver);
      const processes = serializer.getProcesses();

      expect(processes).to.have.length(2);

      processes.forEach(assertEntity);
    });

    it('returns processes only', async () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);
      const processes = serializer.getProcesses();

      expect(processes).to.have.length(1);
    });

    it('isExecutable is available in behaviour', async () => {
      const serializer = Serializer(lanesModdleContext, typeResolver);
      const processes = serializer.getProcesses();

      expect(processes).to.have.length(2);

      expect(processes[0]).to.have.property('behaviour').with.property('isExecutable', true);
      expect(processes[1]).to.have.property('behaviour').with.property('isExecutable', false);
    });

    it('returns only processes', async () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);
      const processes = serializer.getProcesses();

      expect(processes).to.have.length(1);

      expect(processes[0]).to.have.property('type', 'bpmn:Process');
    });
  });

  describe('getExecutableProcesses()', () => {
    it('returns executable processes', async () => {
      const serializer = Serializer(lanesModdleContext, typeResolver);
      const executableProcesses = serializer.getExecutableProcesses();
      const processes = serializer.getProcesses();

      expect(executableProcesses).to.have.length(1);
      expect(processes).to.have.length(2);
      expect(executableProcesses[0]).to.have.property('id', 'mainProcess');
      expect(executableProcesses[0]).to.have.property('behaviour').with.property('isExecutable', true);
    });

    it('returns all executable processes', async () => {
      const serializer = Serializer(twoProcessesModdleContext, typeResolver);
      const processes = serializer.getExecutableProcesses();

      expect(processes).to.have.length(2);
      expect(processes[0]).to.have.property('behaviour').with.property('isExecutable', true);
      expect(processes[1]).to.have.property('behaviour').with.property('isExecutable', true);
    });
  });

  describe('getProcessesById(id)', () => {
    it('returns process with id', async () => {
      const serializer = Serializer(lanesModdleContext, typeResolver);
      expect(serializer.getProcessById('mainProcess')).to.be.ok;
      expect(serializer.getProcessById('participantProcess')).to.be.ok;
    });

    it('returns nothing if not found', async () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);
      expect(serializer.getProcessById('subProcess')).to.not.be.ok;
    });
  });

  describe('getActivities([scopeId])', () => {
    it('returns all activities', async () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);

      const activities = serializer.getActivities();

      expect(activities).to.have.length(5);

      activities.forEach(assertEntity);
    });

    it('with scope returns activities for given process or sub process', async () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);

      const processActivities = serializer.getActivities('mainProcess');
      expect(processActivities).to.have.length(3);
      processActivities.forEach((activity) => {
        assertEntity(activity);
        expect(activity.parent).to.have.property('id', 'mainProcess');
      });

      const subProcessActivities = serializer.getActivities('subProcess');

      expect(subProcessActivities).to.have.length(2);
      subProcessActivities.forEach((activity) => {
        assertEntity(activity);
        expect(activity.parent).to.have.property('id', 'subProcess');
      });
    });
  });

  describe('getSequenceFlows([scopeId])', () => {
    let serializer;
    before(() => {
      serializer = Serializer(lanesModdleContext, typeResolver);
    });

    it('returns all sequence flows', () => {
      expect(serializer.getSequenceFlows()).to.have.length(6);
    });

    it('flows have the expected properties', () => {
      const flows = serializer.getSequenceFlows();
      flows.forEach(assertSequenceFlow);
    });

    it('with scope id returns sequence flows belonging to scope', () => {
      expect(serializer.getSequenceFlows('mainProcess')).to.have.length(3);
      expect(serializer.getSequenceFlows('participantProcess')).to.have.length(3);
    });
  });

  describe('getSequenceFlowById(id)', () => {
    it('returns sequence flow with id', async () => {
      const serializer = Serializer(lanesModdleContext, typeResolver);
      expect(serializer.getSequenceFlowById('flow1')).to.be.ok;
      expect(serializer.getSequenceFlowById('flow-p-1')).to.be.ok;
    });

    it('returns nothing if not found', async () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);
      expect(serializer.getSequenceFlowById('subProcess')).to.not.be.ok;
    });
  });

  describe('getOutboundSequenceFlows(activityId)', () => {
    let serializer;
    before(async () => {
      serializer = Serializer(await testHelpers.moddleContext(factory.valid()), typeResolver);
    });

    it('returns activity outbound sequence flows', () => {
      const flows = serializer.getOutboundSequenceFlows('theStart');
      expect(flows).to.have.length(1);
      flows.forEach(assertSequenceFlow);
    });

    it('returns all outbound', () => {
      const flows = serializer.getOutboundSequenceFlows('decision');
      expect(flows).to.have.length(2);
    });

    it('empty array if non found', () => {
      const flows = serializer.getOutboundSequenceFlows('end1');
      expect(flows).to.have.length(0);
    });

    it('marks default sequence flows', () => {
      const flows = serializer.getOutboundSequenceFlows('decision');
      expect(flows).to.have.length(2);
      expect(flows[0]).to.have.property('isDefault', true);
    });

    it('conditional flow returns condition in behaviour', () => {
      const flows = serializer.getOutboundSequenceFlows('decision');
      expect(flows).to.have.length(2);
      expect(flows[1]).to.have.property('behaviour').with.property('conditionExpression');
    });

    it('contains only sequence flows', () => {
      const flows = Serializer(lanesModdleContext, typeResolver).getOutboundSequenceFlows('task1');
      expect(flows).to.have.length(1);
      expect(flows[0]).to.have.property('type', 'bpmn:SequenceFlow');
    });
  });

  describe('getInboundSequenceFlows()', () => {
    let contextMapper;
    before(async () => {
      contextMapper = Serializer(await testHelpers.moddleContext(factory.valid()), typeResolver);
    });

    it('returns activity inbound sequence flows', () => {
      const flows = contextMapper.getInboundSequenceFlows('end2');
      expect(flows).to.have.length(1);
      flows.forEach(assertSequenceFlow);
    });

    it('empty array if non found', () => {
      const flows = contextMapper.getInboundSequenceFlows('theStart');
      expect(flows).to.have.length(0);
    });

    it('returns inbound for sub process', () => {
      const flows = Serializer(subProcessModdleContext, typeResolver).getInboundSequenceFlows('subProcess');
      expect(flows).to.have.length(1);
    });

    it('main process doesn´t return inbound for sub process', () => {
      const flows = Serializer(subProcessModdleContext, typeResolver).getInboundSequenceFlows('mainProcess');
      expect(flows).to.have.length(0);
    });

    it('returns sequence flows only', () => {
      const flows = Serializer(lanesModdleContext, typeResolver).getInboundSequenceFlows('intermediate');
      expect(flows).to.have.length(1);
      expect(flows[0]).to.have.property('type', 'bpmn:SequenceFlow');
    });
  });

  describe('getMessageFlows()', () => {
    let contextMapper;
    before(() => {
      contextMapper = Serializer(lanesModdleContext, typeResolver);
    });

    it('with scope returns all outbound message flows from scope (process)', () => {
      const flows = contextMapper.getMessageFlows('mainProcess');
      expect(flows).to.have.length(1);
      expect(flows[0]).to.have.property('type', 'bpmn:MessageFlow');
      expect(flows[0]).to.have.property('Behaviour', types.MessageFlow);
    });

    it('without scope returns all message flows', () => {
      const flows = contextMapper.getMessageFlows();
      expect(flows).to.have.length(2);

      expect(flows[0]).to.have.property('type', 'bpmn:MessageFlow');
      expect(flows[0]).to.have.property('id', 'fromMainTaskMessageFlow');
      expect(flows[0]).to.have.property('source').that.eql({
        processId: 'mainProcess',
        id: 'task1',
      });
      expect(flows[0]).to.have.property('target').that.eql({
        processId: 'participantProcess',
        id: 'messageStartEvent',
      });
      expect(flows[0]).to.have.property('Behaviour', types.MessageFlow);

      expect(flows[1]).to.have.property('type', 'bpmn:MessageFlow');
      expect(flows[1]).to.have.property('id', 'fromCompleteTaskMessageFlow');
      expect(flows[1]).to.have.property('source').that.eql({
        processId: 'participantProcess',
        id: 'completeTask',
      });
      expect(flows[1]).to.have.property('target').that.eql({
        processId: 'mainProcess',
        id: 'intermediate',
      });
      expect(flows[1]).to.have.property('Behaviour', types.MessageFlow);
    });
  });

  describe('Service implementation', () => {
    const source = `
    <?xml version="1.0" encoding="UTF-8"?>
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <process id="theProcess" isExecutable="true">
        <sendTask id="send" implementation="\${environment.services.request}" />
        <serviceTask id="service" implementation="\${environment.services.request}" />
        <serviceTask id="dummyService" />
      </process>
    </definitions>`;

    let contextMapper;
    before(async () => {
      const moddleContext = await testHelpers.moddleContext(source);
      contextMapper = Serializer(moddleContext, typeResolver);
    });

    it('ServiceTask receives service implementation', () => {
      const activity = contextMapper.getActivityById('service');
      expect(activity.behaviour).to.have.property('Service', types.ServiceImplementation);
    });

    it('SendTask receives service implementation', () => {
      const activity = contextMapper.getActivityById('send');
      expect(activity.behaviour).to.have.property('Service', types.ServiceImplementation);
    });

    it('ServiceTask without implementation receives no implementation', () => {
      const activity = contextMapper.getActivityById('dummyService');
      expect(activity.behaviour).to.not.have.property('Service');
    });
  });

  describe('Multi instance', () => {
    const source = `
    <?xml version="1.0" encoding="UTF-8"?>
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <process id="theProcess" isExecutable="true">
        <task id="loop">
          <multiInstanceLoopCharacteristics>
            <loopCardinality>\${environment.variables.maxCardinality}</loopCardinality>
            <completionCondition xsi:type="bpmn:tFormalExpression">\${environment.services.completed}</completionCondition>
          </multiInstanceLoopCharacteristics>
        </task>
      </process>
    </definitions>`;

    let contextMapper;
    before(async () => {
      const moddleContext = await testHelpers.moddleContext(source);
      contextMapper = Serializer(moddleContext, typeResolver);
    });

    it('task receives multi instance loopcharacteristics', () => {
      const activity = contextMapper.getActivityById('loop');

      expect(activity.behaviour)
        .to.have.property('loopCharacteristics')
        .with.property('Behaviour', types.MultiInstanceLoopCharacteristics);
      expect(activity.behaviour.loopCharacteristics.behaviour)
        .to.have.property('loopCardinality', '${environment.variables.maxCardinality}');
      expect(activity.behaviour.loopCharacteristics.behaviour)
        .to.have.property('completionCondition', '${environment.services.completed}');
    });
  });

  describe('bpmn:SubProcess', () => {
    const source = `<?xml version="1.0" encoding="UTF-8"?>
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" id="task-definitions" targetNamespace="http://bpmn.io/schema/bpmn">
      <process id="Process_1" isExecutable="true">
        <subProcess id="activity">
          <ioSpecification><dataInput id="activityInput" />
            <dataOutput id="activityOutput" />
          </ioSpecification>
          <dataInputAssociation id="dataInputAssociation">
            <sourceRef>activityInput</sourceRef>
            <targetRef>myDataRef</targetRef>
          </dataInputAssociation>
          <dataOutputAssociation id="dataOutputAssociation">
            <sourceRef>activityOutput</sourceRef>
            <targetRef>myDataRef</targetRef>
          </dataOutputAssociation>
        </subProcess>
        <dataObject id="myData" />
        <dataObjectReference id="myDataRef" dataObjectRef="myData" />
      </process>
    </definitions>`;

    let contextMapper;
    before(async () => {
      const moddleContext = await testHelpers.moddleContext(source);
      contextMapper = Serializer(moddleContext, typeResolver);
    });

    it('process with empty subProcess delivers the right amount of children', () => {
      expect(contextMapper.getActivities()).to.have.length(1);
      expect(contextMapper.getSequenceFlows()).to.have.length(0);
      expect(contextMapper.getDataObjects()).to.have.length(1);
    });
  });

  describe('bpmn:Error', () => {
    let contextMapper;
    before(async () => {
      const moddleContext = await testHelpers.moddleContext(factory.resource('bound-error.bpmn'));
      contextMapper = Serializer(moddleContext, typeResolver);
    });

    it('getErrorById(id) returns error', () => {
      const error = contextMapper.getErrorById('Error_0');
      expect(error).to.be.ok;

      expect(error).to.have.property('type', 'bpmn:Error');
      expect(error).to.have.property('name', 'InputError');
      expect(error).to.have.property('Behaviour', types.BpmnError);
      expect(error).to.have.property('parent').that.eql({id: 'Definitions_1', type: 'bpmn:Definitions'});
      expect(error).to.have.property('behaviour').that.include({errorCode: '404'});
    });

    it('error reference is stored with activity', () => {
      const activity = contextMapper.getActivityById('errorEvent');
      expect(activity).to.be.ok;

      expect(activity.behaviour).to.have.property('eventDefinitions').with.length(1);
      expect(activity.behaviour.eventDefinitions[0])
        .to.have.property('behaviour')
        .with.property('errorRef')
        .with.property('id', 'Error_0');
    });
  });

  describe('bpmn:TimerEventDefinition', () => {
    let contextMapper;
    before(async () => {
      contextMapper = Serializer(eventDefinitionModdleContext, typeResolver);
    });

    it('time duration is stored with activity', () => {
      const activity = contextMapper.getActivityById('timerEvent');
      expect(activity).to.be.ok;

      expect(activity.behaviour).to.have.property('eventDefinitions').with.length(1);
      expect(activity.behaviour.eventDefinitions[0])
        .to.have.property('Behaviour', types.TimerEventDefinition);
      expect(activity.behaviour.eventDefinitions[0])
        .to.have.property('behaviour')
        .with.property('timeDuration', 'PT0.05S');
    });
  });

  describe('io', () => {
    const source = `
    <?xml version="1.0" encoding="UTF-8"?>
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <process id="theProcess" isExecutable="true">
        <dataObjectReference id="inputToUserRef" dataObjectRef="userInfo" />
        <dataObjectReference id="outputFromUserRef" dataObjectRef="global" />
        <dataObjectReference id="globalRef" dataObjectRef="global" />
        <dataObject id="userInfo" />
        <dataObject id="global" />
        <dataObject id="noref" />
        <userTask id="userTask">
          <ioSpecification id="inputSpec">
            <dataInput id="userInput" name="info" />
            <dataOutput id="userOutput" name="result" />
          </ioSpecification>
          <dataInputAssociation id="associatedWith" sourceRef="inputToUserRef" targetRef="userInput" />
          <dataOutputAssociation id="associatedWithOut" sourceRef="userOutput" targetRef="outputFromUserRef" />
        </userTask>
      </process>
      <process id="theOtherProcess" isExecutable="true">
        <dataObjectReference id="inputToUserRefTo" dataObjectRef="duplex" />
        <dataObject id="duplex" />
        <userTask id="userTaskTo">
          <ioSpecification id="inputSpecTo">
            <dataInput id="userInputTo" name="info" />
            <dataOutput id="userOutputTo" name="info" />
            <inputSet id="inputGroup">
              <dataInputRefs>userInputTo</dataInputRefs>
            </inputSet>
            <outputSet id="outputGroup">
              <dataOutputRefs>userOutputTo</dataOutputRefs>
            </outputSet>
          </ioSpecification>
          <dataInputAssociation id="associatedWithTo" sourceRef="inputToUserRefTo" targetRef="userInputTo" />
          <dataOutputAssociation id="associatedWithTo" sourceRef="userOutputTo" targetRef="inputToUserRefTo" />
        </userTask>
      </process>
    </definitions>`;

    let contextMapper;
    before(async () => {
      const moddleContext = await testHelpers.moddleContext(source);
      contextMapper = Serializer(moddleContext, typeResolver);
    });

    it('getDataObjects() returns dataObjects', () => {
      const dataObjects = contextMapper.getDataObjects();
      expect(dataObjects).to.have.length(4);

      dataObjects.forEach((dataObject) => {
        expect(dataObject).to.have.property('id').that.is.ok;
        expect(dataObject).to.have.property('parent').that.is.ok;
        expect(dataObject.parent).to.have.property('id').that.is.ok;
        expect(dataObject.parent).to.have.property('type', 'bpmn:Process');
      });
    });

    it('getDataObjectById() returns dataObject', () => {
      const dataObject = contextMapper.getDataObjectById('global');
      expect(dataObject).to.have.property('id', 'global');
      expect(dataObject).to.have.property('Behaviour', types.DataObject);
    });

    it('activity with IoSpecification returns ioSpecification with reference to dataObject', () => {
      const activity = contextMapper.getActivityById('userTask');
      const ioSpecification = activity.behaviour.ioSpecification;
      expect(ioSpecification).to.be.ok;
      expect(ioSpecification).to.have.property('Behaviour', types.IoSpecification);

      expect(ioSpecification).to.have.property('behaviour').with.property('dataInputs').with.length(1);

      expect(ioSpecification.behaviour.dataInputs[0]).to.have.property('id', 'userInput');
      expect(ioSpecification.behaviour.dataInputs[0]).to.have.property('name', 'info');

      expect(ioSpecification.behaviour.dataInputs[0])
        .to.have.property('behaviour')
        .with.property('association')
        .with.property('source')
        .with.property('dataObject')
        .with.property('id', 'userInfo');

      expect(ioSpecification).to.have.property('behaviour').with.property('dataOutputs').with.length(1);

      expect(ioSpecification.behaviour.dataOutputs[0]).to.have.property('id', 'userOutput');
      expect(ioSpecification.behaviour.dataOutputs[0]).to.have.property('name', 'result');

      expect(ioSpecification.behaviour.dataOutputs[0])
        .to.have.property('behaviour')
        .with.property('association')
        .with.property('target')
        .with.property('dataObject')
        .with.property('id', 'global');
    });

    it('activity with IoSpecification input- outputSets returns ioSpecification with reference to dataObject', () => {
      const activity = contextMapper.getActivityById('userTaskTo');
      const ioSpecification = activity.behaviour.ioSpecification;

      expect(ioSpecification).to.be.ok;
      expect(ioSpecification).to.have.property('Behaviour', types.IoSpecification);

      expect(ioSpecification).to.have.property('behaviour').with.property('dataInputs').with.length(1);

      expect(ioSpecification.behaviour.dataInputs[0]).to.have.property('id', 'userInputTo');
      expect(ioSpecification.behaviour.dataInputs[0]).to.have.property('name', 'info');

      expect(ioSpecification.behaviour.dataInputs[0])
        .to.have.property('behaviour')
        .with.property('association')
        .with.property('source')
        .with.property('dataObject')
        .with.property('id', 'duplex');

      expect(ioSpecification).to.have.property('behaviour').with.property('dataOutputs').with.length(1);

      expect(ioSpecification.behaviour.dataOutputs[0]).to.have.property('id', 'userOutputTo');
      expect(ioSpecification.behaviour.dataOutputs[0]).to.have.property('name', 'info');

      expect(ioSpecification.behaviour.dataOutputs[0])
        .to.have.property('behaviour')
        .with.property('association')
        .with.property('target')
        .with.property('dataObject')
        .with.property('id', 'duplex');
    });
  });

  describe('serialize()', () => {
    it('returns stringified copy of mapped context', () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);
      const serialized = JSON.parse(serializer.serialize());

      expect(serialized).to.have.property('id').that.is.ok;
      expect(serialized).to.have.property('type').that.is.ok;
      expect(serialized).to.have.property('activities').that.is.an('array');
      expect(serialized).to.have.property('dataObjects').that.is.an('array');
      expect(serialized).to.have.property('definition').that.is.an('object').and.ok;
      expect(serialized).to.have.property('errors').that.is.an('array');
      expect(serialized).to.have.property('messageFlows').that.is.an('array');
      expect(serialized).to.have.property('processes').that.is.an('array');
      expect(serialized).to.have.property('sequenceFlows').that.is.an('array');
    });
  });

  describe('deserialize(deserializedContext, typeResolver)', () => {
    it('holds definition id, type, and name', async () => {
      const serializer = Serializer(lanesModdleContext, typeResolver);
      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);
      expect(deserialized).to.have.property('id', 'Definitions_1');
      expect(deserialized).to.have.property('type', 'bpmn:Definitions');
      expect(deserialized).to.have.property('name', 'Lanes');
    });

    it('has the expected api', async () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);
      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);

      expect(deserialized).to.have.property('getActivities').that.is.a('function');
      expect(deserialized).to.have.property('getActivities').that.is.a('function');
      expect(deserialized).to.have.property('getActivityById').that.is.a('function');
      expect(deserialized).to.have.property('getDataObjects').that.is.a('function');
      expect(deserialized).to.have.property('getErrorById').that.is.a('function');
      expect(deserialized).to.have.property('getInboundSequenceFlows').that.is.a('function');
      expect(deserialized).to.have.property('getMessageFlows').that.is.a('function');
      expect(deserialized).to.have.property('getOutboundSequenceFlows').that.is.a('function');
      expect(deserialized).to.have.property('getProcessById').that.is.a('function');
      expect(deserialized).to.have.property('getProcesses').that.is.a('function');
      expect(deserialized).to.have.property('getExecutableProcesses').that.is.a('function');
      expect(deserialized).to.have.property('getSequenceFlowById').that.is.a('function');
      expect(deserialized).to.have.property('getSequenceFlows').that.is.a('function');
      expect(deserialized).to.have.property('serialize').that.is.a('function');
    });

    it('has entities with Behaviour', async () => {
      let serializer = Serializer(eventDefinitionModdleContext, typeResolver);
      let deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);

      deserialized.getProcesses().forEach(assertEntity);
      deserialized.getActivities().forEach(assertEntity);
      deserialized.getErrors().forEach(assertEntity);
      deserialized.getDataObjects().forEach(assertEntity);
      deserialized.getMessageFlows().forEach(assertEntity);

      serializer = Serializer(lanesModdleContext, typeResolver);
      deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);

      deserialized.getProcesses().forEach(assertEntity);
      deserialized.getActivities().forEach(assertEntity);
      deserialized.getErrors().forEach(assertEntity);
      deserialized.getDataObjects().forEach(assertEntity);
      deserialized.getMessageFlows().forEach(assertEntity);

      serializer = Serializer(subProcessModdleContext, typeResolver);
      deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);

      deserialized.getProcesses().forEach(assertEntity);
      deserialized.getActivities().forEach(assertEntity);
      deserialized.getErrors().forEach(assertEntity);
      deserialized.getDataObjects().forEach(assertEntity);
      deserialized.getMessageFlows().forEach(assertEntity);
    });

    it('multi instance is also deserializable', async () => {
      const source = `
      <?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <process id="theProcess" isExecutable="true">
          <task id="loop">
            <multiInstanceLoopCharacteristics>
              <loopCardinality>\${environment.variables.maxCardinality}</loopCardinality>
              <completionCondition xsi:type="bpmn:tFormalExpression">\${environment.services.completed}</completionCondition>
            </multiInstanceLoopCharacteristics>
          </task>
        </process>
      </definitions>`;

      const serializer = Serializer(await testHelpers.moddleContext(source), typeResolver);
      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);
      const activity = deserialized.getActivityById('loop');

      expect(activity.behaviour)
        .to.have.property('loopCharacteristics')
        .with.property('Behaviour', types.MultiInstanceLoopCharacteristics);
      expect(activity.behaviour.loopCharacteristics.behaviour)
        .to.have.property('loopCardinality', '${environment.variables.maxCardinality}');
      expect(activity.behaviour.loopCharacteristics.behaviour)
        .to.have.property('completionCondition', '${environment.services.completed}');
    });
  });

  describe('TypeResolver(types[, extender])', () => {
    it('executes passed extender function with default type mapping', async () => {
      function Escalation() {}
      function IntermediateThrowEvent() {}
      function EscalationEventDefinition() {}

      const myTypeResolver = TypeResolver(types, (activityTypes) => {
        activityTypes['bpmn:Escalation'] = Escalation;
        activityTypes['bpmn:IntermediateThrowEvent'] = IntermediateThrowEvent;
        activityTypes['bpmn:EscalationEventDefinition'] = EscalationEventDefinition;
      });

      const moddleContext = await testHelpers.moddleContext(factory.resource('escalation.bpmn'));

      const serializer = Serializer(moddleContext, myTypeResolver);

      const event = serializer.getActivityById('intermediateThrowEvent_1');
      expect(event).to.be.ok;
      expect(event).to.have.property('Behaviour', IntermediateThrowEvent);
      expect(event).to.have.property('behaviour').with.property('eventDefinitions').with.length(1);

      expect(event.behaviour.eventDefinitions[0]).to.have.property('Behaviour', EscalationEventDefinition);

      const escalation = serializer.getActivityById('escalation_1');
      expect(escalation).to.be.ok;
      expect(escalation).to.have.property('Behaviour', Escalation);
      expect(escalation.behaviour).to.have.property('escalationCode', '10');
    });
  });
});

function assertEntity(activity) {
  const {type, behaviour} = activity;

  expect(activity, type).to.have.property('id').that.is.ok;
  expect(activity, type).to.have.property('type').that.is.ok;
  expect(activity, `${type}.Behaviour`).to.have.property('Behaviour').that.is.a('function');
  expect(activity, type).to.have.property('parent').that.is.ok.and.an('object');
  expect(activity.parent, `${type}.parent`).to.have.property('id').that.is.ok;
  expect(activity.parent, `${type}.parent`).to.have.property('type').that.is.ok;

  expect(activity).to.have.property('behaviour').that.is.ok;
  if (behaviour.loopCharacteristics) {
    expect(behaviour.loopCharacteristics, `${type}.loopCharacteristics`).to.have.property('Behaviour', types.MultiInstanceLoopCharacteristics);
  }
  if (behaviour.ioSpecification) {
    expect(behaviour.ioSpecification, `${type}.ioSpecification`).to.have.property('Behaviour', types.IoSpecification);
  }
  if (behaviour.eventDefinitions) {
    behaviour.eventDefinitions.forEach((def) => {
      expect(def, `${type}.eventDefinitions.${def.type}`).to.have.property('Behaviour').that.is.a('function');
    });
  }
  if (behaviour.eventDefinitions) {
    behaviour.eventDefinitions.forEach((def) => {
      expect(def, `${type}.eventDefinitions.${def.type}`).to.have.property('Behaviour').that.is.a('function');
    });
  }
}

function assertSequenceFlow(flow) {
  expect(flow).to.have.property('id').that.is.ok;
  expect(flow).to.have.property('type').that.is.ok;
  expect(flow).to.have.property('Behaviour', types.SequenceFlow);
  expect(flow).to.have.property('sourceId').that.is.ok;
  expect(flow).to.have.property('targetId').that.is.ok;
  expect(flow).to.have.property('parent').that.is.ok.and.an('object');
  expect(flow.parent).to.have.property('id').that.is.ok;
  expect(flow.parent).to.have.property('type', 'bpmn:Process');
}

describe('type resolver', () => {
  it('throws if type is not found', () => {
    const resolver = TypeResolver({});
    expect(() => {
      resolver({$type: 'Unknown'});
    }).to.throw(/Unknown activity/i);
  });
});
